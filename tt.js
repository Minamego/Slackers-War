var e = solve();
console.log(e);
function solve()
{
    var u  = 1;
    for(var i = 0 ; i<1000000 ; i++)
    {
        u = i+i+u;
    }
    return u;
}